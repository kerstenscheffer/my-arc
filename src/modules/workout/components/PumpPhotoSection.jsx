// src/modules/workout/components/PumpPhotoSection.jsx
import { useState, useEffect } from 'react'
import { Camera, Heart, Flame, Zap, Crown, TrendingUp, Star } from 'lucide-react'
import UploadPhotoModal from './pump-photos/UploadPhotoModal'
import CompactPhotoCard from './pump-photos/CompactPhotoCard'

export default function PumpPhotoSection({ client, db }) {
  const isMobile = window.innerWidth <= 768
  const [activeTab, setActiveTab] = useState('feed') // 'feed' or 'mine'
  const [photos, setPhotos] = useState([])
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (client?.id && db) {
      loadData()
    }
  }, [client?.id, db, activeTab, refreshKey])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load photos based on active tab
      const clientId = activeTab === 'mine' ? client.id : null
      const { data: feedData } = await db.getPumpPhotoFeed(20, 0, clientId)
      setPhotos(feedData || [])

      // Load weekly stats
      const { data: statsData } = await db.getWeeklyPhotoStats(client.id)
      setWeeklyStats(statsData)
      
    } catch (error) {
      console.error('❌ Error loading pump photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUploaded = () => {
    setShowUploadModal(false)
    setRefreshKey(prev => prev + 1)
  }

  const progressPercentage = weeklyStats?.photos_uploaded 
    ? Math.min((weeklyStats.photos_uploaded / 1) * 100, 100) 
    : 0

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header Card - Sidebar Style */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        borderRadius: '0',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 20px rgba(249, 115, 22, 0.15)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(249, 115, 22, 0.1) 10px,
            rgba(249, 115, 22, 0.1) 20px
          )`,
          pointerEvents: 'none'
        }} />

        {/* Camera decoration */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-3%',
          opacity: 0.05
        }}>
          <Camera size={isMobile ? 120 : 150} color="#f97316" />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              color: '#f97316',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '-0.02em',
              textShadow: '0 0 20px rgba(249, 115, 22, 0.3)'
            }}>
              <Camera size={isMobile ? 18 : 22} />
              PUMP FOTO'S
            </h2>

            {/* Upload Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: 'none',
                borderRadius: '0',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.3)'
                }
              }}
            >
              <Camera size={isMobile ? 18 : 20} />
              {!isMobile && 'Upload Foto'}
            </button>
          </div>

          {/* Weekly Progress - Sidebar Style */}
          <div style={{
            background: 'rgba(23, 23, 23, 0.6)',
            border: '1px solid rgba(249, 115, 22, 0.1)',
            borderRadius: '0',
            padding: isMobile ? '1rem' : '1.25rem',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <span style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600'
              }}>
                Deze Week
              </span>
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: weeklyStats?.requirement_met ? '#10b981' : '#f97316',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {weeklyStats?.photos_uploaded || 0}/1
                {weeklyStats?.requirement_met && ' ✅'}
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{
              height: '6px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '0',
              overflow: 'hidden',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercentage}%`,
                background: weeklyStats?.requirement_met
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: progressPercentage > 0 
                  ? `0 0 15px ${weeklyStats?.requirement_met ? 'rgba(16, 185, 129, 0.5)' : 'rgba(249, 115, 22, 0.5)'}` 
                  : 'none'
              }} />
            </div>

            {/* Streak */}
            {weeklyStats?.streak_count > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: '#f97316',
                fontWeight: '700'
              }}>
                <Flame size={16} style={{ filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))' }} />
                {weeklyStats.streak_count} weken streak! 🔥
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs - Sidebar Style */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <button
          onClick={() => setActiveTab('feed')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem' : '0.875rem',
            background: activeTab === 'feed' 
              ? 'rgba(249, 115, 22, 0.15)' 
              : 'rgba(23, 23, 23, 0.6)',
            border: activeTab === 'feed'
              ? '1px solid rgba(249, 115, 22, 0.4)'
              : '1px solid rgba(249, 115, 22, 0.1)',
            borderRadius: '0',
            color: activeTab === 'feed' ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backdropFilter: 'blur(10px)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          Community Feed
        </button>

        <button
          onClick={() => setActiveTab('mine')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem' : '0.875rem',
            background: activeTab === 'mine' 
              ? 'rgba(249, 115, 22, 0.15)' 
              : 'rgba(23, 23, 23, 0.6)',
            border: activeTab === 'mine'
              ? '1px solid rgba(249, 115, 22, 0.4)'
              : '1px solid rgba(249, 115, 22, 0.1)',
            borderRadius: '0',
            color: activeTab === 'mine' ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backdropFilter: 'blur(10px)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          Mijn Foto's
        </button>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? '3rem 1rem' : '4rem 2rem',
          background: 'rgba(23, 23, 23, 0.6)',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          borderRadius: '0',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(249, 115, 22, 0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600'
          }}>
            Foto's laden...
          </p>
        </div>
      ) : photos.length === 0 ? (
        <div style={{
          background: 'rgba(23, 23, 23, 0.6)',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          borderRadius: '0',
          padding: isMobile ? '3rem 1.5rem' : '4rem 2rem',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <Camera 
            size={isMobile ? 48 : 64} 
            color="rgba(249, 115, 22, 0.3)"
            style={{ margin: '0 auto 1rem' }}
          />
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            {activeTab === 'mine' 
              ? 'Je hebt nog geen pump foto\'s geüpload'
              : 'Nog geen pump foto\'s in de feed'
            }
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '0',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px'
            }}
          >
            <Camera size={18} />
            Upload je eerste foto!
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {photos.map((photo, index) => (
            <CompactPhotoCard
              key={photo.id}
              photo={photo}
              currentUser={client}
              db={db}
              onUpdate={() => setRefreshKey(prev => prev + 1)}
              delay={index * 50}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadPhotoModal
          client={client}
          db={db}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handlePhotoUploaded}
        />
      )}

      {/* CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
