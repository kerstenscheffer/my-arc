// src/modules/photos-8ch/Photos8CH.jsx
import React, { useState, useEffect } from 'react'
import Photos8CHService from './Photos8CHService'
import PhotoUploader from './components/PhotoUploader'
import FridayTracker from './components/FridayTracker'
import { 
  Camera, Calendar, Check, X, Image, Grid, 
  ChevronLeft, ChevronRight, Trash2, Star,
  Award, AlertCircle, Clock, Utensils, Dumbbell,
  Trophy, TrendingUp, Zap, Target, Flame
} from 'lucide-react'

export default function Photos8CH({ db, client }) {
  const [service] = useState(() => new Photos8CHService(db))
  const [photos, setPhotos] = useState({})
  const [todayPhotos, setTodayPhotos] = useState(null)
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [fridayProgress, setFridayProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const [uploadType, setUploadType] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewMode, setViewMode] = useState('overview') // overview | gallery | stats
  const [filterType, setFilterType] = useState('all') // all | progress | meal | workout | victory
  const [refreshKey, setRefreshKey] = useState(0)
  
  const isMobile = window.innerWidth <= 768
  const isToday = new Date().getDay() === 5 // Is it Friday?
  const dailyGoals = service.getDailyGoals()

  useEffect(() => {
    if (client?.id) {
      loadAllData()
    }
  }, [client?.id, refreshKey])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Load photos
      const photoData = await service.getPhotos(
        client.id, 
        100, 
        filterType === 'all' ? null : filterType
      )
      setPhotos(photoData)
      
      // Load today's photos
      const today = await service.getTodayPhotos(client.id)
      setTodayPhotos(today)
      
      // Load weekly stats
      const stats = await service.getWeeklyStats(client.id)
      setWeeklyStats(stats)
      
      // Load Friday progress
      const challengeStart = new Date('2025-01-01')
      const progress = await service.getChallengePhotoProgress(client.id, challengeStart)
      setFridayProgress(progress)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUploaded = () => {
    setShowUploader(false)
    setUploadType(null)
    setRefreshKey(prev => prev + 1)
  }

  const handleDeletePhoto = async (photoId, photoUrl) => {
    if (!confirm('Weet je zeker dat je deze foto wilt verwijderen?')) return
    
    try {
      await service.deletePhoto(photoId, photoUrl)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      alert('Kon foto niet verwijderen')
    }
  }

  const getMotivationalMessage = () => {
    const messages = {
      meal: [
        'Laat zien wat je eet! Inspireer anderen met je gezonde keuzes.',
        'Deel je maaltijd en krijg tips van je coach.',
        'Track je voeding visueel voor betere inzichten.'
      ],
      workout: [
        'Capture the pump! Laat je workout zien.',
        'Deel je prestatie en motiveer anderen.',
        'Vastleggen = commitment naar jezelf.'
      ],
      progress: [
        'Vrijdag check-in! Tijd voor je progress photos.',
        'Front en side foto voor je transformatie tracking.',
        'Consistentie is key - elke week telt!'
      ]
    }
    
    const type = isToday ? 'progress' : todayPhotos?.counts.meal < 3 ? 'meal' : 'workout'
    const typeMessages = messages[type]
    return typeMessages[Math.floor(Math.random() * typeMessages.length)]
  }

  const renderHeader = () => (
    <div style={{
      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      borderRadius: isMobile ? '16px' : '24px',
      padding: isMobile ? '1.5rem' : '2rem',
      marginBottom: isMobile ? '1.5rem' : '2rem',
      boxShadow: '0 20px 40px rgba(220, 38, 38, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated streak indicator */}
      {weeklyStats?.streak > 0 && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Flame size={16} color="white" />
          <span style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'white'
          }}>
            {weeklyStats.streak} dagen streak
          </span>
        </div>
      )}

      <h1 style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <Camera size={isMobile ? 24 : 32} />
        Visual Journey Tracker
      </h1>

      <p style={{
        fontSize: isMobile ? '0.9rem' : '1rem',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: '1.5rem'
      }}>
        {getMotivationalMessage()}
      </p>

      {/* Quick action buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {[
          { type: 'meal', icon: Utensils, label: 'Maaltijd', color: '#10b981' },
          { type: 'workout', icon: Dumbbell, label: 'Workout', color: '#f97316' },
          { type: 'progress', icon: Camera, label: 'Progress', color: '#a855f7' },
          { type: 'victory', icon: Trophy, label: 'Victory', color: '#fbbf24' }
        ].map(action => {
          const ActionIcon = action.icon
          return (
            <button
              key={action.type}
              onClick={() => {
                setUploadType(action.type)
                setShowUploader(true)
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: isMobile ? '0.75rem' : '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <ActionIcon size={20} color={action.color} />
              <span style={{
                fontSize: '0.85rem',
                color: 'white',
                fontWeight: '500'
              }}>
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderDailyGoals = () => {
    if (!todayPhotos) return null
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          color: 'white',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Target size={18} />
          Dagelijkse Doelen
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '0.75rem'
        }}>
          {/* Meals Goal */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '0.75rem',
            border: todayPhotos.counts.meal >= 3 
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Utensils size={16} color="#10b981" />
                <span style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  Maaltijden
                </span>
              </div>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: todayPhotos.counts.meal >= 3 ? '#10b981' : 'white'
              }}>
                {todayPhotos.counts.meal}/3
              </span>
            </div>
            <div style={{
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(100, (todayPhotos.counts.meal / 3) * 100)}%`,
                height: '100%',
                background: '#10b981',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Workout Goal */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '0.75rem',
            border: todayPhotos.counts.workout >= 1
              ? '1px solid rgba(249, 115, 22, 0.3)'
              : '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Dumbbell size={16} color="#f97316" />
                <span style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  Workout
                </span>
              </div>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: todayPhotos.counts.workout >= 1 ? '#f97316' : 'white'
              }}>
                {todayPhotos.counts.workout >= 1 ? 'Klaar!' : 'Nog niet'}
              </span>
            </div>
            <div style={{
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: todayPhotos.counts.workout >= 1 ? '100%' : '0%',
                height: '100%',
                background: '#f97316',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Progress Goal (Friday only) */}
          {isToday && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              padding: '0.75rem',
              border: todayPhotos.hasRequiredProgress
                ? '1px solid rgba(168, 85, 247, 0.3)'
                : '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Camera size={16} color="#a855f7" />
                  <span style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    Progress
                  </span>
                </div>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: todayPhotos.hasRequiredProgress ? '#a855f7' : 'white'
                }}>
                  {todayPhotos.progressSubtypes.length}/2
                </span>
              </div>
              <div style={{
                display: 'flex',
                gap: '0.25rem'
              }}>
                {['front', 'side'].map(subtype => (
                  <div
                    key={subtype}
                    style={{
                      flex: 1,
                      height: '4px',
                      background: todayPhotos.progressSubtypes.includes(subtype)
                        ? '#a855f7'
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: '2px'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderWeeklyStats = () => {
    if (!weeklyStats) return null
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          color: 'white',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <TrendingUp size={18} />
          Week Overzicht
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem'
        }}>
          {[
            { label: 'Meals', value: weeklyStats.meal, icon: Utensils, color: '#10b981' },
            { label: 'Workouts', value: weeklyStats.workout, icon: Dumbbell, color: '#f97316' },
            { label: 'Progress', value: weeklyStats.progress, icon: Camera, color: '#a855f7' },
            { label: 'Victories', value: weeklyStats.victory, icon: Trophy, color: '#fbbf24' }
          ].map(stat => {
            const StatIcon = stat.icon
            return (
              <div key={stat.label} style={{
                textAlign: 'center',
                padding: '0.5rem'
              }}>
                <StatIcon size={20} color={stat.color} style={{ marginBottom: '0.25rem' }} />
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase'
                }}>
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderPhotoGrid = () => {
    const dates = Object.keys(photos).sort((a, b) => new Date(b) - new Date(a))
    
    if (dates.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '3rem 1rem' : '4rem 2rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5))',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Camera size={isMobile ? 48 : 64} color="rgba(255,255,255,0.3)" style={{ marginBottom: '1rem' }} />
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '600',
            color: 'white',
            marginBottom: '0.5rem'
          }}>
            Start je visual journey
          </div>
          <div style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '1.5rem'
          }}>
            Upload je eerste foto om te beginnen!
          </div>
        </div>
      )
    }
    
    return (
      <div>
        {dates.map(date => {
          const dateData = photos[date]
          const dateObj = new Date(date)
          const isFriday = dateObj.getDay() === 5
          
          return (
            <div key={date} style={{
              marginBottom: isMobile ? '1.5rem' : '2rem'
            }}>
              {/* Date Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Calendar size={16} color="rgba(255,255,255,0.5)" />
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: '500'
                }}>
                  {dateObj.toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
                {isFriday && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    borderRadius: '6px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    Vrijdag
                  </div>
                )}
              </div>
              
              {/* Photos by Type */}
              {dateData.progress.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#a855f7',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    Progress Photos
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
                    gap: '0.5rem'
                  }}>
                    {dateData.progress.map(photo => renderPhotoCard(photo, 'progress'))}
                  </div>
                </div>
              )}
              
              {dateData.meals.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#10b981',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    Maaltijden
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${isMobile ? 3 : 6}, 1fr)`,
                    gap: '0.5rem'
                  }}>
                    {dateData.meals.map(photo => renderPhotoCard(photo, 'meal'))}
                  </div>
                </div>
              )}
              
              {dateData.workouts.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#f97316',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    Workouts
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${isMobile ? 3 : 6}, 1fr)`,
                    gap: '0.5rem'
                  }}>
                    {dateData.workouts.map(photo => renderPhotoCard(photo, 'workout'))}
                  </div>
                </div>
              )}
              
              {dateData.victories.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#fbbf24',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    Victories
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
                    gap: '0.5rem'
                  }}>
                    {dateData.victories.map(photo => renderPhotoCard(photo, 'victory'))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderPhotoCard = (photo, type) => {
    const typeColors = {
      progress: '#a855f7',
      meal: '#10b981',
      workout: '#f97316',
      victory: '#fbbf24'
    }
    
    const height = type === 'progress' || type === 'victory' ? '150px' : '100px'
    
    return (
      <div key={photo.id} style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${typeColors[type]}20`,
        background: '#0a0a0a'
      }}>
        <img
          src={photo.photo_url}
          alt={`${type} photo`}
          style={{
            width: '100%',
            height: height,
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        
        {/* Fallback */}
        <div style={{
          width: '100%',
          height: height,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
        }}>
          <Image size={24} color="rgba(255,255,255,0.3)" />
        </div>
        
        {/* Subtype label for progress photos */}
        {type === 'progress' && photo.metadata?.subtype && (
          <div style={{
            position: 'absolute',
            bottom: '0.25rem',
            left: '0.25rem',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '4px',
            padding: '0.125rem 0.375rem',
            fontSize: '0.7rem',
            color: typeColors[type],
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {photo.metadata.subtype}
          </div>
        )}
        
        {/* Delete button */}
        <button
          onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
          style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.9)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0'
          }}
        >
          <Trash2 size={12} color="white" />
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(220, 38, 38, 0.2)',
          borderTopColor: '#dc2626',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div>
      {renderHeader()}
      
      {/* View Mode Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'overview', label: 'Overzicht', icon: Grid },
          { id: 'gallery', label: 'Galerij', icon: Image },
          { id: 'stats', label: 'Statistieken', icon: TrendingUp }
        ].map(view => {
          const ViewIcon = view.icon
          return (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id)}
              style={{
                padding: '0.75rem 1.25rem',
                background: viewMode === view.id 
                  ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                  : 'transparent',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                color: viewMode === view.id ? 'white' : '#94a3b8',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: viewMode === view.id ? '600' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ViewIcon size={16} />
              {view.label}
            </button>
          )
        })}
      </div>
      
      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <>
          {renderDailyGoals()}
          {renderWeeklyStats()}
          {fridayProgress && (
            <FridayTracker 
              progress={fridayProgress}
              isMobile={isMobile}
            />
          )}
        </>
      )}
      
      {viewMode === 'gallery' && (
        <>
          {/* Filter buttons */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {['all', 'progress', 'meal', 'workout', 'victory'].map(type => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type)
                  setRefreshKey(prev => prev + 1)
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: filterType === type 
                    ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: filterType === type ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: filterType === type ? '600' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'capitalize'
                }}
              >
                {type === 'all' ? 'Alles' : type}
              </button>
            ))}
          </div>
          
          {renderPhotoGrid()}
        </>
      )}
      
      {viewMode === 'stats' && fridayProgress && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'white',
              marginBottom: '1rem'
            }}>
              Challenge Voortgang
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                  Friday Sets Complete
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {fridayProgress.fridaySets.completeSets}/8
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                  Totaal Photos
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                  {fridayProgress.totalPhotos}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'white',
              marginBottom: '1rem'
            }}>
              Photo Breakdown
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {Object.entries(fridayProgress.photoCounts).map(([type, count]) => (
                <div key={type}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'capitalize'
                  }}>
                    {type}
                  </div>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: 'white' 
                  }}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploader && (
        <PhotoUploader
          service={service}
          clientId={client.id}
          onClose={() => {
            setShowUploader(false)
            setUploadType(null)
          }}
          onUploaded={handlePhotoUploaded}
          uploadType={uploadType}
          todayPhotos={todayPhotos}
          isMobile={isMobile}
        />
      )}
      
      {/* Floating Action Button */}
      <button
        onClick={() => setShowUploader(true)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '90px' : '2rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #dc2626, #991b1b)',
          border: 'none',
          boxShadow: '0 10px 30px rgba(220, 38, 38, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(220, 38, 38, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(220, 38, 38, 0.4)'
        }}
      >
        <Camera size={24} color="white" />
      </button>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
